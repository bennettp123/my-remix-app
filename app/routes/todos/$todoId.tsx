import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";

import type { Todo } from "~/models/todo.server";
import { deleteTodo } from "~/models/todo.server";
import { setTodoCompletion } from '~/models/todo.server'
import { getTodo } from "~/models/todo.server";
import { requireUserId } from "~/session.server";

type LoaderData = {
  todo: Todo;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.todoId, "todoId not found");

  const todo = await getTodo({ userId, id: params.todoId });
  if (!todo) {
    throw new Response("Not Found", { status: 404 });
  }
  return json<LoaderData>({ todo });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.todoId, "todoId not found");

  const formData = await request.formData();
  const action = formData.get('action')

  if (action === 'delete') {
    await deleteTodo({ userId, id: params.todoId });
    return redirect("/todos");
  } else if (action === 'update') {
    const isComplete = formData.getAll('is-complete')?.includes('complete')
    await setTodoCompletion({ userId, id: params.todoId, isComplete })
  }
};

export default function TodoDetailsPage() {
  const data = useLoaderData() as LoaderData;

  return (
    <div>
      <Form method="post">
        <input type="checkbox" name="is-complete" defaultChecked={data.todo.isComplete} value="complete" />
        <h3 className="text-2xl font-bold">{data.todo.title}</h3>
        <p className="py-6">{data.todo.description}</p>
        <hr className="my-4" />
        <button
          name="action"
          value="delete"
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Delete
        </button>
      </Form>
    </div>
  );
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
