const { createApp } = Vue

createApp({
    data() {
        return {
            ws: null,
            messages: [],
            newMessage: '',
            username: '',
            tempUsername: '',
            isConnected: false,
            onlineUsers: []
        }
    },
    methods: {
        connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
            this.ws = new WebSocket(`${protocol}//${window.location.host}/ws/${this.username}`)
            
            this.ws.onopen = () => {
                this.isConnected = true
            }
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data)
                console.log('Received message:', data)  // Debug log
                
                if (data.type === 'users') {
                    this.onlineUsers = data.users
                } else {
                    this.messages.push(data)
                    this.$nextTick(() => {
                        this.scrollToBottom()
                    })
                }
            }
            
            this.ws.onclose = () => {
                this.isConnected = false
                this.messages.push({
                    type: 'system',
                    message: 'Disconnected from chat. Reconnecting...'
                })
                setTimeout(() => this.connectWebSocket(), 1000)
            }
        },
        
        sendMessage() {
            if (!this.newMessage.trim() || !this.isConnected) return
            
            console.log('Sending message:', this.newMessage)  // Debug log
            
            const message = {
                type: 'chat',
                message: this.newMessage.trim()
            }
            
            this.ws.send(JSON.stringify(message))
            this.newMessage = ''
        },
        
        setUsername() {
            if (!this.tempUsername.trim()) return
            this.username = this.tempUsername.trim()
            this.connectWebSocket()
        },
        
        scrollToBottom() {
            const container = this.$refs.messageContainer
            if (container) {
                container.scrollTop = container.scrollHeight
            }
        },
        
        formatTime(timestamp) {
            if (!timestamp) return ''
            const date = new Date(timestamp)
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    }
}).mount('#app')
