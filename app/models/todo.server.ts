import arc from "@architect/functions";
import cuid from "cuid";

import type { User } from "./user.server";

export type Todo = {
    id: ReturnType<typeof cuid>
    userId: User["id"]
    title: string
    description: string
    isComplete: boolean
}

type TodoItem = {
    pk: User["id"];
    sk: `todo#${Todo["id"]}`;
}
  
const skToId = (sk: TodoItem["sk"]): Todo["id"] => sk.replace(/^todo#/, "")
const idToSk = (id: Todo["id"]): TodoItem["sk"] => `todo#${id}`

export async function getTodo({
    id,
    userId,
}: Pick<Todo, "id" | "userId">): Promise<Todo | null> {
    const db = await arc.tables();

    const result = await await db.app.get({ pk: userId, sk: idToSk(id) });
    
    if (!result) {
        return null
    }

    return {
        id: result.sk,
        userId: result.pk,
        title: result.title,
        description: result.description,
        isComplete: result.isComplete,
    }
}


export async function getTodoListItems({
    userId,
  }: Pick<Todo, "userId">): Promise<Array<Pick<Todo, "id" | "title">>> {
    const db = await arc.tables();
  
    const result = await db.app.query({
      KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": userId,
        ":sk": 'todo#',
      },
    });
  
    return result.Items.map((n: any) => ({
      title: n.title,
      id: skToId(n.sk),
    }));
  }

export async function createTodo({
    userId,
    title,
    description,
    isComplete,
}: Pick<Todo, "userId" | "title" | "description" | "isComplete">): Promise<Todo> {
    const db = await arc.tables()
  
    const result = await db.app.put({
        pk: userId,
        sk: idToSk(cuid()),
        title,
        description,
        isComplete,
    })

    return {
        id: skToId(result.sk),
        userId: result.pk,
        title: result.title,
        description: result.description,
        isComplete: result.isComplete,
    };
  }
  