// imports/collections/index.js
import required from './defaultRules/required';
import length from './defaultRules/length';
import minLength from './defaultRules/minLength';
import maxLength from './defaultRules/maxLength';
import regex from './defaultRules/regex';
import email from './defaultRules/email';
import equal from './defaultRules/equal';
import hasValues from './defaultRules/hasValues';
import cpf from './defaultRules/cpf';
import date from './defaultRules/date';
import phone from './defaultRules/phone';

export default {
  required,
  minLength,
  maxLength,
  regex,
  email,
  equal,
  hasValues,
  cpf,
  date,
  phone,
  length
}