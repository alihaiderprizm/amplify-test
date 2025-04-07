/**
 * Represents a Todo item in the application
 */
export interface Todo {
  /** Unique identifier for the todo item */
  id: string;
  /** Title or description of the todo item */
  title: string;
  /** Completion status of the todo item */
  completed: boolean;
  /** ISO string representing when the todo was created */
  createdAt: string;
  /** ISO string representing when the todo was last updated */
  updatedAt: string;
  /** Optional priority level of the todo (1-5) */
  priority?: number;
  /** Optional due date for the todo */
  dueDate?: string;
  /** Optional tags for categorizing todos */
  tags?: string[];
}

/**
 * Represents the input type for creating a new todo
 */
export interface CreateTodoInput {
  title: string;
  priority?: number;
  dueDate?: string;
  tags?: string[];
}

/**
 * Represents the input type for updating an existing todo
 */
export interface UpdateTodoInput {
  id: string;
  title?: string;
  completed?: boolean;
  priority?: number;
  dueDate?: string;
  tags?: string[];
} 