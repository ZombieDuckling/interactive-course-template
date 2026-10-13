#!/usr/bin/env node
/*
 * Lightweight smoke validator for the single-file course template.
 * Uses only Node.js built-ins so contributors can run it without installing
 * packages or a browser automation stack.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const coursePath = path.join(repoRoot, 'course.html');
const errors = [];

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function stripHashAndQuery(value) {
  return value.split('#')[0].split('?')[0];
}

function isExternalOrSpecial(value) {
  return (
    !value ||
    value.startsWith('#') ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.startsWith('//')
  );
}

function extractCourseDataLiteral(html) {
  const marker = 'const COURSE_DATA';
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Missing `const COURSE_DATA` declaration.');
  }

  const equalsIndex = html.indexOf('=', markerIndex);
  if (equalsIndex === -1) {
    throw new Error('COURSE_DATA declaration is missing `=`.');
  }

  const start = html.indexOf('{', equalsIndex);
  if (start === -1) {
    throw new Error('COURSE_DATA declaration is missing opening `{`.');
  }

  let depth = 0;
  let quote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    const next = html[i + 1];

    if (inLineComment) {
      if (ch === '\n' || ch === '\r') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }

  throw new Error('Could not find the end of the COURSE_DATA object.');
}

function evaluateCourseData(literal) {
  // The template intentionally stores course content as a JS object literal.
  // Evaluating only the extracted literal avoids running DOM code from the page.
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${literal});`)();
}

function validateLocalReferences(html) {
  const attrPattern = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
  let match;
  while ((match = attrPattern.exec(html)) !== null) {
    const rawTarget = match[2].trim();
    if (isExternalOrSpecial(rawTarget)) continue;

    const target = stripHashAndQuery(rawTarget);
    if (!target) continue;

    const resolved = path.resolve(repoRoot, target);
    if (!resolved.startsWith(repoRoot + path.sep) && resolved !== repoRoot) {
      fail(`Local reference escapes repository root: ${rawTarget}`);
      continue;
    }

    if (!fs.existsSync(resolved)) {
      fail(`Missing local reference target: ${rawTarget}`);
    }
  }
}

function validateString(value, label) {
  assert(typeof value === 'string' && value.trim().length > 0, `${label} must be a non-empty string.`);
}

function validateCourseData(courseData) {
  assert(courseData && typeof courseData === 'object' && !Array.isArray(courseData), 'COURSE_DATA must evaluate to an object.');
  validateString(courseData.title, 'COURSE_DATA.title');
  validateString(courseData.subtitle, 'COURSE_DATA.subtitle');
  validateString(courseData.welcomeText, 'COURSE_DATA.welcomeText');

  assert(Array.isArray(courseData.stats), 'COURSE_DATA.stats must be an array.');
  courseData.stats.forEach((stat, index) => {
    validateString(stat && stat.num, `COURSE_DATA.stats[${index}].num`);
    validateString(stat && stat.label, `COURSE_DATA.stats[${index}].label`);
  });

  assert(Array.isArray(courseData.pages) && courseData.pages.length > 0, 'COURSE_DATA.pages must contain at least one lesson page.');
  courseData.pages.forEach((page, pageIndex) => {
    const label = `COURSE_DATA.pages[${pageIndex}]`;
    validateString(page && page.nav, `${label}.nav`);
    validateString(page && page.badge, `${label}.badge`);
    validateString(page && page.title, `${label}.title`);
    validateString(page && page.subtitle, `${label}.subtitle`);
    validateString(page && page.content, `${label}.content`);

    assert(Array.isArray(page.quiz), `${label}.quiz must be an array; use [] when there is no quiz.`);
    page.quiz.forEach((question, questionIndex) => {
      const qLabel = `${label}.quiz[${questionIndex}]`;
      validateString(question && question.q, `${qLabel}.q`);
      assert(Array.isArray(question && question.opts) && question.opts.length > 0, `${qLabel}.opts must be a non-empty array.`);
      if (Array.isArray(question && question.opts)) {
        question.opts.forEach((option, optionIndex) => validateString(option, `${qLabel}.opts[${optionIndex}]`));
      }
      assert(Number.isInteger(question && question.correct), `${qLabel}.correct must be an integer.`);
      if (Number.isInteger(question && question.correct) && Array.isArray(question && question.opts)) {
        assert(question.correct >= 0 && question.correct < question.opts.length, `${qLabel}.correct must point to an existing option.`);
      }
    });
  });

  assert(Array.isArray(courseData.sidebarSections), 'COURSE_DATA.sidebarSections must be an array.');
  const seenPages = new Set();
  courseData.sidebarSections.forEach((section, sectionIndex) => {
    const label = `COURSE_DATA.sidebarSections[${sectionIndex}]`;
    validateString(section && section.label, `${label}.label`);
    assert(Array.isArray(section && section.pages), `${label}.pages must be an array.`);
    if (!Array.isArray(section && section.pages)) return;

    section.pages.forEach((pageNumber, entryIndex) => {
      const entryLabel = `${label}.pages[${entryIndex}]`;
      assert(Number.isInteger(pageNumber), `${entryLabel} must be an integer page number.`);
      if (Number.isInteger(pageNumber)) {
        assert(pageNumber >= 1, `${entryLabel} must be >= 1 because page 0 is the generated Welcome page.`);
        assert(pageNumber <= courseData.pages.length, `${entryLabel} points past the last lesson page (${courseData.pages.length}).`);
        seenPages.add(pageNumber);
      }
    });
  });

  for (let pageNumber = 1; pageNumber <= courseData.pages.length; pageNumber += 1) {
    assert(seenPages.has(pageNumber), `Lesson page ${pageNumber} is not linked from sidebarSections.`);
  }

  assert(Array.isArray(courseData.flashcards), 'COURSE_DATA.flashcards must be an array.');
  courseData.flashcards.forEach((card, index) => {
    validateString(card && card.q, `COURSE_DATA.flashcards[${index}].q`);
    validateString(card && card.a, `COURSE_DATA.flashcards[${index}].a`);
  });

  assert(Array.isArray(courseData.qa), 'COURSE_DATA.qa must be an array.');
  courseData.qa.forEach((item, index) => {
    validateString(item && item.q, `COURSE_DATA.qa[${index}].q`);
    validateString(item && item.a, `COURSE_DATA.qa[${index}].a`);
  });

  assert(Array.isArray(courseData.checklist), 'COURSE_DATA.checklist must be an array.');
  courseData.checklist.forEach((item, index) => validateString(item, `COURSE_DATA.checklist[${index}]`));
}

function main() {
  assert(fs.existsSync(coursePath), 'Missing course.html at repository root.');
  const html = fs.readFileSync(coursePath, 'utf8');

  assert(/^\s*<!doctype html>/i.test(html), 'course.html should start with <!DOCTYPE html>.');
  assert(/<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i.test(html), 'course.html must set <html lang="...">.');
  assert(/<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*>/i.test(html), 'course.html must include a viewport meta tag.');
  assert(/<title>\s*[^<\s][^<]*<\/title>/i.test(html), 'course.html must include a non-empty <title>.');
  assert(/<main\b[^>]*\bid\s*=\s*["']main["']/i.test(html), 'course.html must include <main id="main"> for rendered content.');
  assert(/<nav\b[^>]*\bid\s*=\s*["']sidebar["']/i.test(html), 'course.html must include <nav id="sidebar"> for course navigation.');

  validateLocalReferences(html);

  let courseData;
  try {
    courseData = evaluateCourseData(extractCourseDataLiteral(html));
  } catch (error) {
    fail(`COURSE_DATA could not be evaluated: ${error.message}`);
  }

  if (courseData) validateCourseData(courseData);

  if (errors.length > 0) {
    console.error(`Static course validation failed with ${errors.length} issue(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Validated course.html: ${courseData.pages.length} lesson pages, ${courseData.flashcards.length} flashcards, ${courseData.qa.length} Q&A entries.`);
}

main();
