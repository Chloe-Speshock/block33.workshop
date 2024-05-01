require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`
);

const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

// READ categories
app.get("/api/categories", async (req, res, next) => {
  try {
    const SQL = `SELECT * from categories`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/notes", async (req, res, next) => {
  try {
    const SQL = `SELECT * from notes`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// CREATE note
app.post("/api/notes", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        INSERT INTO notes(txt, category_id)
        VALUES($1, $2)
        RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.category_id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// UPDATE note
app.put("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
        UPDATE notes 
        SET txt=$1, ranking=$2, category_id=$3, updated_at=now()
        WHERE id=$4
        RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.ranking,
      req.body.category_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//DELETE note
app.delete("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE from notes WHERE id = $1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

//handle errors
// app.use((error, req, res, next) => {
//   res.status(res.status || 500).send;
// });

const init = async () => {
  await client.connect();

  let SQL = /* sql */ `
    DROP TABLE IF EXISTS notes;
    DROP TABLE IF EXISTS categories;

    CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
    );

    CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        ranking INTEGER DEFAULT 3 NOT NULL,
        txt VARCHAR(255) NOT NULL,
        category_id INTEGER REFERENCES categories(id) NOT NULL
    );
    `;
  await client.query(SQL);
  console.log("tables created");

  SQL = /* sql */ `
  INSERT INTO categories(name) VALUES('SQL');
  INSERT INTO categories(name) VALUES('Express');
  INSERT INTO categories(name) VALUES('Lincoln');

  INSERT INTO notes(txt, ranking, category_id) VALUES('learn express', 5, 
  (SELECT id FROM categories WHERE name='Express'));

  INSERT INTO notes(txt, ranking, category_id) VALUES('add logging middleware', 5, 
  (SELECT id FROM categories WHERE name='Express'));

  INSERT INTO notes(txt, ranking, category_id) VALUES('write SQL queries', 4, 
  (SELECT id FROM categories WHERE name='SQL'));
  `;

  await client.query(SQL);
  console.log("data seeded");
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
};

init();
