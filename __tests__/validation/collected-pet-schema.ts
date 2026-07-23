import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import type { CollectedPet } from './collected-pet.ts';
const SCHEMA_PATH = path.resolve('collected-pet.schema.json');

const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')) as object;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateCollectedPet = ajv.compile<CollectedPet>(schema);

function formatValidationErrors(): string {
  return (validateCollectedPet.errors ?? [])
    .map((error) => {
      const location = error.instancePath || '(root)';
      return `${location} ${error.message ?? 'invalid'}`;
    })
    .join('; ');
}

/** 使用 collected-pet.schema.json 校验并返回类型化数据 */
export function assertCollectedPetSchema(value: unknown): CollectedPet {
  if (!validateCollectedPet(value)) {
    throw new Error(`采集 JSON 不符合 schema：${formatValidationErrors()}`);
  }
  return value;
}
