
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
}

export const ANSWER: IAnswer = {
    id: "",
    answer: "",
    correctAnswer: false,
}