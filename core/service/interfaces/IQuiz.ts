export interface IQuiz {
    id?: string;
    title: string;
    description?: string;
    isPublished?: boolean;
    questions: IQuestion[];
    created: Date;
}

export const QUIZ: IQuiz = {
    id: "",
    title: "",
    description: "",
    isPublished: false,
    questions: [],
    created: new Date(),
}

export interface IQuestion {
    id: string;
    question: string;
    answers: IAnswer[];
    answer: string;
    created: Date;
}

export const QUESTION: IQuestion = {
    id: "",
    question: "",
    answers: [],
    answer: "",
    created: new Date(),
}

export interface IAnswer {
    id: string;
    answer: string;
    correctAnswer: boolean;
    questionId?: string;
}

export const ANSWER: IAnswer = {
    id: "",
    answer: "",
    correctAnswer: false,
    questionId: ""
}