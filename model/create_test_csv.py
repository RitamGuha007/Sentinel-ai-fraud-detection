
import pandas as pd

# Load the original dataset
data = pd.read_csv("model/creditcard.csv")

# Select legitimate and fraudulent transactions
legitimate = data[data["Class"] == 0].sample(n=10, random_state=42)
fraudulent = data[data["Class"] == 1].sample(n=10, random_state=42)

# Combine both groups
test_data = pd.concat([legitimate, fraudulent])

# Shuffle the transactions
test_data = test_data.sample(frac=1, random_state=42)

# Remove the target column because the API predicts it
test_data = test_data.drop("Class", axis=1)

# Save the test CSV
test_data.to_csv("model/mixed_test_transactions.csv", index=False)

print("Mixed test CSV created successfully!")
print("Total transactions:", len(test_data))