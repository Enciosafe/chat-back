const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

const server = require('https').createServer(app)

const io = require('socket.io')(server,{
    cors: {
        origin: "https://simple-chat-node-react.herokuapp.com/",
        methods: ["get", "post"]
    }
});


const rooms = new Map()

app.get('/rooms/:id', (req, res)=>{
    const { id: roomId } = req.params
    const obj = rooms.has(roomId) ? {
        users: [...rooms.get(roomId).get('users').values()],
        messages: [...rooms.get(roomId).get('messages').values()]
    } : { users: [], messages: [] }
    res.json(obj)
})

app.post('/rooms', (req, res) => {
    const {roomId, userName} = req.body
    if (!rooms.has(roomId)) {
        rooms.set(
            roomId,
            new Map([
                ['users', new Map()],
                ['messages', []],
        ]),
            )
    }
    res.send()
})

io.on('connection', (socket) => {
    socket.on('ROOM:JOIN', ({roomId, userName}) => {
        socket.join(roomId) //подключаемся в определенную комнату к сокету
        rooms.get(roomId).get('users').set(socket.id, userName) // сохраняем в БД (тут в MAP)
        const users = [...rooms.get(roomId).get('users').values()] // получаем список всех пользователей
        io.in(roomId).emit('ROOM:SET_USERS', users) //оповещаем всех из списка в выбранной комнате что я вошел
    })

    socket.on('ROOM:NEW_MESSAGE', ({roomId, userName, text}) => {
        const obj = {
            userName,
            text,
        }
        rooms.get(roomId).get('messages').push(obj)
        io.in(roomId).emit('ROOM:NEW_MESSAGE', obj)
    })

    console.log('user connected', socket.id)
    socket.on('disconnect', ()=>{
        rooms.forEach((value, roomId) => {
            if(value.get('users').delete(socket.id)) {
                const users = [...value.get('users').values()] // получаем список всех пользователей
                io.in(roomId).emit('ROOM:SET_USERS', users) //оповещаем всех из списка в выбранной комнате что я вошел
            }
        })
    })
})



const PORT = 9999
server.listen(PORT, (e) => {
    if(e) {
        throw Error(e)
    }
    console.log(`Сервер работает на порту ${PORT}`)})