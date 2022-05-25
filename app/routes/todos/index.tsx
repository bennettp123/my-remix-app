import { Link } from "@remix-run/react";

export default function TodoIndexPage() {
  return (
    <p>
      No todo selected. Select a todo on the left, or{" "}
      <Link to="new" className="text-blue-500 underline">
        create a new todo.
      </Link>
    </p>
  );
}
