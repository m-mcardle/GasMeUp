import md5 from 'md5';

export function getIcon({ email, name }: { email: string; name: string }) {
  const emailHash = md5((email ?? name).toLowerCase());
  return { uri: `https://www.gravatar.com/avatar/${emailHash}?d=identicon` };
}

export default {
  getIcon,
};
