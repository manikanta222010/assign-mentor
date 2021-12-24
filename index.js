import express from "express"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"

dotenv.config()
const app = express()
const PORT = process.env.PORT

app.use(express.json())

const MONGO_URL = "mongodb+srv://mani:welcome123@cluster0.qz0gv.mongodb.net/"
//"mongodb://localhost:27017/"
//"mongodb+srv://mani:welcome123@cluster0.qz0gv.mongodb.net"

async function createConnection() {
    const client = new MongoClient(MONGO_URL)
    await client.connect()
    console.log("Mongodb connected!")
    return client
}
export const client = await createConnection()

// Method to display all the endpoints available.
app.get("/", (request, response) => {
    const data = ` Available endpoints are 
     [ /students --- to get all students ]
     [ /mentors --- to get all mentors ]
     [ /create-student --- to add a new user to the database ]
     [ /create-mentor --- to add a new mentor to the database ]
     [ /assign-student-to-mentor/:id --- to assign students to a particular mentor ]
     [ /all-students-under-mentor/:id --- display all the students under particular mentor ]
     [ /assign-mentor-to-student/:id --- to assign/update mentor to a particular student ]
    `
    response.send(data)
})

//Method to display all the students available.
app.get("/students", async (request, response) => {
    const result = await client.db("assign-mentor").collection("students").find({}).toArray()
    response.send(result)
})

// Method to display all the mentors available.
app.get("/mentors", async (request, response) => {
    const result = await client.db("assign-mentor").collection("mentors").find({}).toArray()
    response.send(result)
})

// Method to add a new student to the students collection
app.post("/create-student", async (request, response) => {
    const data = request.body
    const result = await client.db("assign-mentor").collection("students").insertOne(data)
    response.send(result)
})

// Method to add a new mentor to the mentors collection
app.post("/create-mentor", async (request, response) => {
    const data = request.body
    const result = await client.db("assign-mentor").collection("mentors").insertOne(data)
    response.send(result)
})

// Method to assign students to the given mentor.
app.put("/assign-student-to-mentor/:id", async (request, response) => {
    const { id } = request.params
    const data = request.body

    const mentor = await client.db("assign-mentor").collection("mentors").findOne({ mentor_id: id })
    let students_under_mentor = mentor.students
    const all_students = await client.db("assign-mentor").collection("students").find({}).toArray()
    all_students.forEach(async (x) => {

        if (students_under_mentor.includes(+x.student_id) && !x.mentor) {
            await client.db("assign-mentor").collection("mentors").updateOne({ mentor_id: id }, { $set: data })
            await client.db("assign-mentor").collection("students").updateOne({ student_id: x.student_id }, { $set: { "mentor": id } })
            console.log(x.name, "is assigned to", mentor.name)
        } else if (students_under_mentor.includes(+x.student_id) && !!x.mentor) {
            console.log(x.name, "is already assigned to mentor")
        }
    })
    response.send(mentor)
})

// Displays all the students under the given mentor
app.get("/all-students-under-mentor/:id", async (request, response) => {
    const { id } = request.params
    const mentor = await client.db("assign-mentor").collection("mentors").findOne({ mentor_id: id })
    const all_students = await client.db("assign-mentor").collection("students").find({}).toArray()
    let students_under_mentor = mentor.students

    let result = []
    all_students.forEach((x) => {
        if (students_under_mentor.includes(+x.student_id)) {
            result.push(x.name)
            console.log(x.name)
        }
    })
    response.send(result)
})

// Method to Update or Assign mentor to the given student.
app.put("/assign-mentor-to-student/:id", async (request, response) => {
    const { id } = request.params
    const data = request.body
    const result = await client.db("assign-mentor").collection("students").updateOne({ student_id: id }, { $set: data })
    const student = await client.db("assign-mentor").collection("students").findOne({ student_id: id })
    response.send(student.name + " is assigned to given mentor")
})


app.listen(PORT, () => console.log("App started in ", PORT))