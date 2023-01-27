export const maybeValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

export default { maybeValidEmail };
