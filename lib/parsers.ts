export type VocabularyItem = {
  term: string;
  meaning_en: string;
  part_of_speech?: string | null;
  example_sentence?: string | null;
  pronunciation?: string | null;
  romanization?: string | null;
  notes?: string | null;
};

export type QuestionItem = {
  question: string;
  answer: string;
  difficulty?: string | null;
};

export function parseVocabulary(text: string): VocabularyItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [term = "", meaning = "", part = ""] = line.split("|").map((partValue) => partValue.trim());
      return {
        term,
        meaning_en: meaning,
        part_of_speech: part || null
      };
    })
    .filter((item) => item.term && item.meaning_en);
}

export function parseQuestions(text: string): QuestionItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question = "", answer = ""] = line.split("|").map((partValue) => partValue.trim());
      return { question, answer };
    })
    .filter((item) => item.question && item.answer);
}

export function formatVocabulary(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      const vocab = item as VocabularyItem;
      return [vocab.term, vocab.meaning_en, vocab.part_of_speech ?? ""].join(" | ");
    })
    .join("\n");
}

export function formatQuestions(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      const question = item as QuestionItem;
      return [question.question, question.answer].join(" | ");
    })
    .join("\n");
}
