import arc from "@architect/functions";
import bcrypt from "bcryptjs";
import invariant from "tiny-invariant";

export type User = {
  id: `email#${string}`
  email: string
}

export type Password = {
  id: `email#${string}`
  password: string,
}

export async function getUserById(id: User["id"]): Promise<User | null> {
  const db = await arc.tables();
  const result = await db.app.query({
    KeyConditionExpression: "pk = :pk and sk = :sk",
    ExpressionAttributeValues: {
      ":pk": id,
      ":sk": 'email',
    },
  });

  const [record] = result.Items;
  if (record) return { id: record.pk, email: record.email };
  return null;
}

export async function getUserByEmail(email: User["email"]) {
  return getUserById(`email#${email}`);
}

async function getPasswordByEmail(email: User["email"]) {
  const db = await arc.tables();
  const result = await db.app.query({
    KeyConditionExpression: "pk = :pk and sk = :sk",
    ExpressionAttributeValues: {
      ":pk": `email#${email}`,
      ":sk": 'password',
    },
  });

  const [record] = result.Items;

  if (record) return { hash: record.password };
  return null;
}

export async function createUser(
  email: User["email"],
  password: Password["password"]
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const db = await arc.tables();
  await db.app.put({
    pk: `email#${email}`,
    sk: 'password',
    password: hashedPassword,
  });

  await db.app.put({
    pk: `email#${email}`,
    sk: 'email',
    email,
  });

  const user = await getUserByEmail(email);
  invariant(user, `User not found after being created. This should not happen`);

  return user;
}

export async function deleteUser(email: User["email"]) {
  const db = await arc.tables();
  await db.app.delete({
    pk: `email#${email}`,
    sk: 'password',
  });
  await db.app.delete({
    pk: `email#${email}`,
    sk: 'email',
  });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["password"]
) {
  const userPassword = await getPasswordByEmail(email);

  if (!userPassword) {
    return undefined;
  }

  const isValid = await bcrypt.compare(password, userPassword.hash);
  if (!isValid) {
    return undefined;
  }

  return getUserByEmail(email);
}
