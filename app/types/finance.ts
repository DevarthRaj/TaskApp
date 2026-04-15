export type Priority = "low" | "medium" | "high"

export interface Expense{
    id: number
    note: string
    amount:number
    category: "Enjoyment"| "Investment" | "Responsibilities" | "Healthy-Life"
    date: string


}

export interface MonthData{
    month:string
    salary:number
    expenses: Expense[]

}
export interface Task {
    id: number
    title: string
    completed: boolean
    priority: Priority
}