// imports/collections/index.js
import required from './defaultRules/required';
import minLength from './defaultRules/minLength';
import maxLength from './defaultRules/maxLength';
import userExists from './defaultRules/userExists';
import regex from './defaultRules/regex';
import email from './defaultRules/email';

export default {
  required,
  minLength,
  maxLength,
  userExists,
  regex,
  email
}