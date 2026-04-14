import "dotenv/config";
import app from "./api/index.js";

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
