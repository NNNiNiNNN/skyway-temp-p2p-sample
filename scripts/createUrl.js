const baseUrl = "http://localhost:3000";

const authToken = "YourAuthToken";

createUrl = async () => {
  const response = await fetch(`${baseUrl}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  console.log(await response.json());
};

createUrl();
