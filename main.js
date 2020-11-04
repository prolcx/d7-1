const express = require('express')
const handlebars = require('express-handlebars')
const mysql = require('mysql2/promise')

//port configuration

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'playstore',
    connectionLimit: 4,
    timezone: '+08:00'
})

//SQL
const SQL_GET_APP_CATEGORIES = 'select distinct(category) from apps';

//configure express
const app = express()

app.engine('hbs', handlebars({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')

//application
app.get('/', async (req,resp)=>{
    const conn = await pool.getConnection()
    try {
const results = await conn.query(SQL_GET_APP_CATEGORIES)
const cats = results[0].map(v =>v.category)

resp.status(200)
resp.type('text/html')
resp.render('index' , {category: cats} )

    }catch(e) {
        resp.status(500)
        resp.type('text/html')
        resp.send(JSON.stringify(e))
        
    }finally {
        conn.release()                  //release is the finish
    }
})



//start server
pool.getConnection()
.then(conn => {
    console.info('Pinging database...')
    const p0 = Promise.resolve(conn)    // in this case, conn=pool.getConnection, this line is needed because can't bring conn to the next promise but it is needed in next promise
    const p1 = conn.ping()
    return Promise.all([p0, p1])        //method to allow conn.ping to execute first
    
    //return [conn, conn.ping()]        this method will not work.
})
.then(results => {
    const conn = results[0]             //this is p0 from previous promise
    //release the connection
    // this.conn.release()                 //slightly diff return way compare to day04
    conn.release()
    app.listen(PORT, () =>{
        console.info(`Application started at ${PORT} at ${new Date()}`)
    })
}).catch(e =>{
    console.info('Cannot start connection: ', e)
})