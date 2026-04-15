"use client"
import { useState } from "react"
import { Task, Priority } from "@/app/types"

const initialTask: Task[] = [
    { id: 1, title: "Exercising", completed: false, priority: "high" },
    { id: 2, title: "Coding", completed: false, priority: "high" }
]



export default function Dashboard() {
    const [tasks, setTask] = useState<Task[]>(initialTask)
    const [count, setCount] = useState<number>(0);

    function handleClick() {
        setCount(count + 1);
        setCount(count + 1);
        console.log(count); // This will log the old count value due to state batching
    }
    return (
        <>
            <ul>
                {tasks.map(task => (
                    <li key={task.id}>{task.title}</li>
                ))}
            </ul>
            <button onClick={() => setTask(prev => [...prev, { id: 3, title: "Reading", completed: false, priority: "low" }])}>
                Add Task
            </button>

            <button onClick={handleClick}>Count is {count}</button>

          </>

    )
}