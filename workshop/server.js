require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`
);

const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

//READ
app.get("/api/department", async (req, res, next) => {
  try {
    const SQL = `SELECT * from department`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * from employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//CREATE
// app.post("/api/employees", async (req, res, next) => {
//   try {
//     const SQL = /* sql */ `
//           INSERT INTO employees(txt, department_id)
//           VALUES($1, $2)
//           RETURNING *
//           `;
//     console.log(req.body);
//     const response = await client.query(SQL, [
//       req.body.txt,
//       req.body.department_id,
//     ]);
//     res.send(response.rows[0]);
//   } catch (error) {
//     next(error);
//   }
// });

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
        INSERT INTO employees(txt, department_id)
        VALUES($1, $2)
        RETURNING *
      `;
    console.log(req);
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

//UPDATE
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
          UPDATE employees
          SET txt=$1, department_id=$2, updated_at=now()
          WHERE id=$3
          RETURNING *
          `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//DELETE
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE from employees WHERE id = $1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

//init
const init = async () => {
  await client.connect();

  let SQL = /* sql */ `
  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS department;

  CREATE TABLE department (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
  );

  CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    txt VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES department(id) NOT NULL
  );
  `;
  await client.query(SQL);
  console.log("tables created");

  SQL = /* sql */ `
  INSERT INTO department(name) VALUES('Human Resources');
  INSERT INTO department(name) VALUES('Management');
  INSERT INTO department(name) VALUES('Maintenance');

  INSERT INTO employees(txt, department_id) VALUES('Rich Syp', 
  (SELECT id FROM department WHERE name='Human Resources'));

  INSERT INTO employees(txt, department_id) VALUES('Mitchel Mgliore', 
  (SELECT id FROM department WHERE name='Management'));

  INSERT INTO employees(txt, department_id) VALUES('Luke Aronson', 
  (SELECT id FROM department WHERE name='Management'));

  INSERT INTO employees(txt, department_id) VALUES('Sergio', 
  (SELECT id FROM department WHERE name='Maintenance'));

  INSERT INTO employees(txt, department_id) VALUES('Chris Brown', 
  (SELECT id FROM department WHERE name='Maintenance'));

  `;
  await client.query(SQL);
  console.log("data seeded");
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
};
init();
