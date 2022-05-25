import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Form, useCatch, useLoaderData, useSubmit, useTransition } from '@remix-run/react'
import type { FormEvent } from 'react'
import invariant from 'tiny-invariant'

import type { Todo } from '~/models/todo.server'
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

    await deleteTodo({ userId, id: params.todoId })
    return redirect("/todos")
}

export default function TodoDetailsPage() {
    const data = useLoaderData() as LoaderData
    const submit = useSubmit()
    const transition = useTransition()

    function handleChange(event: FormEvent<HTMLFormElement>) {
        submit(event.currentTarget, {})
    }

    return (
        <div>
            <Form
                method="post"
                action='update'
                onChange={handleChange}
            >
                <input
                    type="checkbox"
                    name="is-complete"
                    defaultChecked={data.todo.isComplete}
                    value="complete"
                />
            </Form>
            <h3 className="text-2xl font-bold">{data.todo.title}</h3>
            <p className="py-6">{data.todo.description}</p>
            <hr className="my-4" />
            <Form method="post">
                <button
                    type="submit"
                    className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
                >
                Delete
                </button>
            </Form>
            { transition.state === 'submitting' ? (
                <p>Saving...</p>
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
