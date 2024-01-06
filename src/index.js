const app = require("./app");
const mongoose = require("./db/mongoose");

const port = process.env.PORT;

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀:Server started on port ${port}`);
    });

    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log("DB ", err.message);
  });
