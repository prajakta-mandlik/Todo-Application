const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
const format = require("date-fns/format");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/todos/", async (request, response) => {
  const {
    priority = "",
    status = "",
    search_q = "",
    category = "",
    due_date = "",
  } = request.query;
  const getTodoDetails = `
     SELECT *
     FROM todo
     WHERE 
        status LIKE '%${status}%' AND
        priority LIKE '%${priority}%' AND
        todo LIKE '%${search_q}%' AND
        category LIKE '%${category}%' AND
        due_date LIKE '%${due_date}%'
    `;
  const todosArray = await db.all(getTodoDetails);
  response.send(todosArray);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * 
    FROM todo
    WHERE 
       id = ${todoId}
    `;
  const getTodoArray = await db.get(getTodoQuery);
  response.send(getTodoArray);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getDateQuery = `
    SELECT * 
    FROM todo
    WHERE 
       due_date = ${date}
    `;
  const dateArray = await db.get(getDateQuery);
  response.send(dateArray);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  if (status === "DONE" || status === "TO DO" || status === "IN PROGRESS") {
    response.status(200);
    const addTodoDetails = `
    INSERT INTO todo(id,todo,status)
    VALUES (
        ${id},
        '${todo}',
        '${status}'
    );`;
  }
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    response.status(200);
    const addTodoDetails = `
    INSERT INTO todo(priority)
    VALUES (
         '${priority}'
    );`;
  }
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    response.status(200);
    const addTodoDetails = `
    INSERT INTO todo(category)
    VALUES (
        '${category}'
    );`;
    const dbResponse = await db.run(addTodoDetails);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    response.send(`Invalid Todo ${updateColumn}`);
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoList = `
    SELECT * 
    FROM todo 
    WHERE 
        id = ${todoId};    
    `;
  const previousTodo = await db.run(previousTodoList);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  if (
    requestBody.status === "DONE" ||
    requestBody.status === "TO DO" ||
    requestBody.status === "IN PROGRESS"
  ) {
    response.status(200);
    const updateTodo = `
        UPDATE todo
        SET 
             status='${status}'
        WHERE 
            id = ${todoId}
        `;
    await db.run(updateTodo);
    response.send(`${updateColumn} Updated`);
  } else if (
    requestBody.priority === "HIGH" ||
    requestBody.priority === "MEDIUM" ||
    requestBody.priority === "LOW"
  ) {
    response.status(200);
    const updateTodo = `
        UPDATE todo
        SET 
             priority='${priority}'
        WHERE 
            id = ${todoId}
        `;
    await db.run(updateTodo);
    response.send(`${updateColumn} Updated`);
  } else if (
    requestBody.category === "WORK" ||
    requestBody.category === "HOME" ||
    requestBody.category === "LEARNING"
  ) {
    response.status(200);
    const updateTodo = `
        UPDATE todo
        SET 
             category='${category}'
        WHERE 
            id = ${todoId}
        `;
    await db.run(updateTodo);
    response.send(`${updateColumn} Updated`);
  } else {
    response.status(400);
    response.send(`Invalid Todo ${updateColumn}`);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
      DELETE FROM todo
      WHERE id = ${todoId}
    `;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
