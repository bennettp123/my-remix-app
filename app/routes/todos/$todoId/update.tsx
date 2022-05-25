import type { ActionFunction } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import invariant from 'tiny-invariant'

import { setTodoCompletion } from '~/models/todo.server'
import { requireUserId } from '~/session.server'

export const action: ActionFunction = async ({ request, params }) => {
    const userId = await requireUserId(request)
    invariant(params.todoId, "todoId not found")

    const formData = await request.formData()
    const action = formData.get('action')

    if (action === 'update') {
        const isComplete = formData.getAll('is-complete')?.includes('complete')
        await setTodoCompletion({ userId, id: params.todoId, isComplete })
        return redirect(`/todos/:${params.todoId}`)
    }
}
