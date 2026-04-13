import { Task } from "../types"

const tasks: Task[] = [
    { id: 1, title: "Exercising", completed: false, priority: "medium" },
    { id: 2, title: "Coding ", completed: false, priority: "high" }
]

export default function Dashboard(): React.ReactNode {
    return (
        <ul>
            {tasks.map(task => (
                <li key={task.id}>{task.title}</li>
            ))}
        </ul>
    )
}