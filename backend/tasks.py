from celery import Celery
from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler, StringIndexer
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.regression import RandomForestRegressor
from pyspark.ml.evaluation import MulticlassClassificationEvaluator, RegressionEvaluator
from pyspark.ml import Pipeline
from pyspark.sql.functions import col
import os, json

celery = Celery("tasks", broker="redis://redis:6379/0")

BASE_DIR = "/data"
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
RESULT_DIR = os.path.join(BASE_DIR, "results")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)


@celery.task
def process_file(file_id: str):
    spark = (
        SparkSession.builder.master("spark://spark-master:7077")
        .appName("BigDataMLJob")
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
        .getOrCreate()
    )

    upload_path = os.path.join(UPLOAD_DIR, file_id)
    csv_path = f"file://{upload_path}"
    result_path = os.path.join(RESULT_DIR, file_id.replace(".csv", ".json"))

    try:
        df = spark.read.options(header=True, inferSchema=True).csv(csv_path)

        stats = {}
        numeric_columns = []
        categorical_columns = []

        for field in df.schema.fields:
            field_type = field.dataType.simpleString()
            if field_type in ("int", "double", "float", "bigint"):
                numeric_columns.append(field.name)
                desc = (
                    df.describe(field.name)
                    .toPandas()
                    .set_index("summary")[field.name]
                    .to_dict()
                )
                stats[field.name] = desc
            elif field_type == "string":
                categorical_columns.append(field.name)
                unique_count = df.select(field.name).distinct().count()
                value_counts = df.groupBy(field.name).count().collect()
                stats[field.name] = {
                    "type": "categorical",
                    "unique_values": unique_count,
                    "value_counts": {
                        row[field.name]: row["count"] for row in value_counts
                    },
                }

        ml_results = {}

        if categorical_columns:
            target_col = categorical_columns[0]
            feature_cols = [col for col in numeric_columns if col != "id"]

            if len(feature_cols) >= 2:
                ml_results["classification"] = train_classification_model(
                    df, feature_cols, target_col, spark
                )

        if len(numeric_columns) >= 3:
            target_col = (
                numeric_columns[0] if numeric_columns[0] != "id" else numeric_columns[1]
            )
            feature_cols = [
                col for col in numeric_columns if col != target_col and col != "id"
            ]

            if len(feature_cols) >= 2:
                ml_results["regression"] = train_regression_model(
                    df, feature_cols, target_col, spark
                )

        if len(numeric_columns) >= 2:
            ml_results["correlations"] = compute_correlations(df, numeric_columns)

        if ml_results:
            ml_results["data_summary"] = {
                "total_rows": df.count(),
                "numeric_columns": len(numeric_columns),
                "categorical_columns": len(categorical_columns),
                "feature_columns": feature_cols if "feature_cols" in locals() else [],
            }

        final_results = {"statistics": stats, "machine_learning": ml_results}

        with open(result_path, "w") as f:
            json.dump(final_results, f, indent=2)

        return {
            "file_id": file_id,
            "status": "done",
            "ml_models_trained": len(ml_results),
        }

    except Exception as e:
        error_result = {
            "error": str(e),
            "statistics": stats if "stats" in locals() else {},
            "machine_learning": {"error": "ML processing failed"},
        }
        with open(result_path, "w") as f:
            json.dump(error_result, f, indent=2)
        return {"file_id": file_id, "status": "error", "error": str(e)}

    finally:
        spark.stop()


def train_classification_model(df, feature_cols, target_col, spark):
    """Train a Random Forest classifier"""
    try:
        assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")

        indexer = StringIndexer(inputCol=target_col, outputCol="label")

        rf = RandomForestClassifier(
            featuresCol="features", labelCol="label", numTrees=50
        )

        pipeline = Pipeline(stages=[assembler, indexer, rf])

        train_df, test_df = df.randomSplit([0.8, 0.2], seed=42)

        model = pipeline.fit(train_df)

        predictions = model.transform(test_df)

        evaluator = MulticlassClassificationEvaluator(
            labelCol="label", predictionCol="prediction", metricName="accuracy"
        )
        accuracy = evaluator.evaluate(predictions)

        rf_model = model.stages[-1]
        feature_importance = {
            feature_cols[i]: float(importance)
            for i, importance in enumerate(rf_model.featureImportances.toArray())
        }

        return {
            "model_type": "Random Forest Classifier",
            "target_column": target_col,
            "feature_columns": feature_cols,
            "accuracy": float(accuracy),
            "feature_importance": feature_importance,
            "train_size": train_df.count(),
            "test_size": test_df.count(),
        }

    except Exception as e:
        return {"error": f"Classification training failed: {str(e)}"}


def train_regression_model(df, feature_cols, target_col, spark):
    try:
        assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")

        df_with_label = df.withColumn("label", col(target_col))

        rf = RandomForestRegressor(
            featuresCol="features", labelCol="label", numTrees=50
        )

        pipeline = Pipeline(stages=[assembler, rf])

        train_df, test_df = df_with_label.randomSplit([0.8, 0.2], seed=42)

        model = pipeline.fit(train_df)

        predictions = model.transform(test_df)

        evaluator = RegressionEvaluator(
            labelCol="label", predictionCol="prediction", metricName="rmse"
        )
        rmse = evaluator.evaluate(predictions)

        r2_evaluator = RegressionEvaluator(
            labelCol="label", predictionCol="prediction", metricName="r2"
        )
        r2 = r2_evaluator.evaluate(predictions)

        rf_model = model.stages[-1]
        feature_importance = {
            feature_cols[i]: float(importance)
            for i, importance in enumerate(rf_model.featureImportances.toArray())
        }

        return {
            "model_type": "Random Forest Regressor",
            "target_column": target_col,
            "feature_columns": feature_cols,
            "rmse": float(rmse),
            "r2_score": float(r2),
            "feature_importance": feature_importance,
            "train_size": train_df.count(),
            "test_size": test_df.count(),
        }

    except Exception as e:
        return {"error": f"Regression training failed: {str(e)}"}


def compute_correlations(df, numeric_columns):
    try:
        correlation_cols = [col for col in numeric_columns if col.lower() != "id"]

        if len(correlation_cols) < 2:
            return {"error": "Need at least 2 numeric columns for correlation"}

        correlations = {}
        for i, col1 in enumerate(correlation_cols):
            correlations[col1] = {}
            for j, col2 in enumerate(correlation_cols):
                if i <= j:
                    corr = df.stat.corr(col1, col2)
                    correlations[col1][col2] = float(corr)
                    if i != j:
                        if col2 not in correlations:
                            correlations[col2] = {}
                        correlations[col2][col1] = float(corr)

        return {"correlation_matrix": correlations, "columns": correlation_cols}

    except Exception as e:
        return {"error": f"Correlation computation failed: {str(e)}"}
