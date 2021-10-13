// imports/collections/index.js
import required from './defaultRules/required';
import minLength from './defaultRules/minLength';
import maxLength from './defaultRules/maxLength';
import regex from './defaultRules/regex';
import email from './defaultRules/email';
import fullName from './defaultRules/fullName';

export default {
  required,
  minLength,
  maxLength,
  regex,
  email,
  fullName
}