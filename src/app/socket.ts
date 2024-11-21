"use client"

import { io } from "socket.io-client"

export const socket = io(process.env.SOCKET_URI || "", {
    autoConnect: false,
    withCredentials: true,
})