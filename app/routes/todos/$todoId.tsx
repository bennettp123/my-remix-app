import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Form, useCatch, useLoaderData, useSubmit, useTransition } from '@remix-run/react'
import invariant from 'tiny-invariant'

import type { Todo } from '~/models/todo.server';
import { setTodoCompletion } from '~/models/todo.server'
import { deleteTodo } from '~/models/todo.server'
import { getTodo } from '~/models/todo.server'
import { requireUserId } from '~/session.server'

export type LoaderData = {
    todo: Todo
}

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
    const _action = formData.get('_action')

    if (_action === 'update') {
        const isComplete = formData.getAll('state')?.includes('completed')
        await setTodoCompletion({ userId, id: params.todoId, isComplete })
        return redirect(`/todos/${params.todoId}`)
    }

    if (_action === 'delete') {
        await deleteTodo({ userId, id: params.todoId })
        return redirect("/todos")
    }

    throw new Error(`unhandled action: ${_action}`)
}

export default function TodoDetailsPage() {
    const data = useLoaderData() as LoaderData
    const submit = useSubmit()
    const transition = useTransition()

    function handleChanges(event: any) {
        submit(event.currentTarget, { replace: true })
    }

    return (
        <div>
            <h3 className="text-2xl font-bold">
                <Form
                    style={{ display: 'inline', paddingRight: '1em' }}
                    method="post"
                    onChange={handleChanges}
                >
                    <input
                        type="hidden"
                        name="_action"
                        value="update"
                    />
                    <input
                        type="checkbox"
                        name="state"
                        checked={data.todo.isComplete}
                        /**
                         * updated server-side, not client-side
                         */
                        readOnly={true}
                        /**
                         * this value is only included in formData when the
                         * checkbox is checked!
                         */
                        value="completed"
                    />
                </Form>
                {data.todo.title}
            </h3>
            <p className="py-6">{data.todo.description}</p>
            <hr className="my-4" />
            <Form method="post">
                <button
                    name="_action"
                    value="delete"
                    type="submit"
                    className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
                >
                Delete
                </button>
            </Form>
            { transition.state === 'submitting' ? (
                <p>Submitting...</p>
            ) : null }
            { transition.state === 'loading' ? (
                <p>Loading...</p>
            ) : null }
        </div>
    )
}

export function ErrorBoundary({ error }: { error: Error }) {
    console.error(error);

    return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
    const caught = useCatch();

    if (caught.status === 404) {
        return <div>Note not found</div>;
    }

    throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
