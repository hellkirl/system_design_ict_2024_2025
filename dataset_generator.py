import uuid
import numpy as np
import pandas as pd
import os

def generate_dataset(n_rows: int = 1000, output_path: str = "synthetic_data.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    ids = np.arange(1, n_rows + 1)

    value1 = np.random.normal(loc=12.0, scale=2.5, size=n_rows)
    value2 = np.random.uniform(low=5.0, high=10.0, size=n_rows)
    value3 = np.random.normal(loc=3.0, scale=0.7, size=n_rows)

    categories = np.random.choice(["A", "B", "C"], size=n_rows, p=[0.4, 0.4, 0.2])

    df = pd.DataFrame(
        {
            "id": ids,
            "value1": value1,
            "value2": value2,
            "value3": value3,
            "category": categories,
        }
    )

    df.to_csv(output_path, index=False)

    print(f"Dataset with {n_rows} rows written to {output_path}")


if __name__ == "__main__":
    output_path = f"data/{str(uuid.uuid4())}.csv"
    generate_dataset(n_rows=5000, output_path=output_path)
    