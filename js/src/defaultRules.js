// imports/collections/index.js
import required from './defaultRules/required';
import length from './defaultRules/length';
import minLength from './defaultRules/minLength';
import maxLength from './defaultRules/maxLength';
import regex from './defaultRules/regex';
import email from './defaultRules/email';
import fullName from './defaultRules/fullName';
import equal from './defaultRules/equal';
import hasValues from './defaultRules/hasValues';

export default {
  required,
  minLength,
  maxLength,
  regex,
  email,
  fullName,
  equal,
  hasValues,
  length
}