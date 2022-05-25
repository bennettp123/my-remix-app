import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import invariant from 'tiny-invariant'

import { getTodo, setTodoCompletion } from '~/models/todo.server'
import { requireUserId } from '~/session.server'
import type { LoaderData } from '../$todoId'

export const loader: LoaderFunction = async ({ request, params }) => {
    const userId = await requireUserId(request)
    invariant(params.todoId, "todoId not found")

    const todo = await getTodo({ userId, id: params.todoId })
    if (!todo) {
        throw new Response("Not Found", { status: 404 })
    }
    return json<LoaderData>({ todo })
}

export const action: ActionFunction = async ({ request, params }) => {
    const userId = await requireUserId(request)
    invariant(params.todoId, "todoId not found")

    const formData = await request.formData()
    const isComplete = formData.getAll('is-complete')?.includes('complete')
    await setTodoCompletion({ userId, id: params.todoId, isComplete })
    return null
}
