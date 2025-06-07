from celery import Celery
from pyspark.sql import SparkSession
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
        .appName("BigDataJob")
        .getOrCreate()
    )

    upload_path = os.path.join(UPLOAD_DIR, file_id)
    csv_path = f"file://{upload_path}"

    result_path = os.path.join(RESULT_DIR, file_id.replace(".csv", ".json"))

    df = spark.read.options(header=True, inferSchema=True).csv(csv_path)

    stats = {}
    for field in df.schema.fields:
        if field.dataType.simpleString() in ("int", "double"):
            desc = (
                df.describe(field.name)
                .toPandas()
                .set_index("summary")[field.name]
                .to_dict()
            )
            stats[field.name] = desc

    with open(result_path, "w") as f:
        json.dump(stats, f)

    spark.stop()
    return {"file_id": file_id, "status": "done"}
