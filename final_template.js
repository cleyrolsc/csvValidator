"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_process_1 = require("node:process");
function getConfigurationOptions(configFilePath) {
    try {
        const config = JSON.parse(node_fs_1.default.readFileSync(configFilePath).toString("utf-8"));
        if (!config.delimiter) {
            return {
                result: false,
                error: `Configuration file '${configFilePath}' has no 'delimiter' parameter.`,
            };
        }
        if (!config.hasHeaders) {
            return {
                result: false,
                error: `Configuration file '${configFilePath}' has no 'hasHeaders' parameter.`,
            };
        }
        if (!config.separator) {
            return {
                result: false,
                error: `Configuration file '${configFilePath}' has no 'separator' parameter.`,
            };
        }
        if (!config.terminator) {
            return {
                result: false,
                error: `Configuration file '${configFilePath}' has no 'terminator' parameter.`,
            };
        }
        return { result: true, options: config };
    }
    catch (error) {
        return { result: false, error: `${error}` };
    }
}
function validateData(data) {
    const errors = [];
    data.forEach((row, rowIndex) => {
        const [name, age, profession, gender] = row;
        // Validate Name
        if (typeof name !== 'string' || name.length > 50) {
            errors.push(`Row ${rowIndex + 1}: Name is not a string or exceeds 50 characters.`);
        }
        else {
            for (let i = 0; i < name.length; i++) {
                const char = name[i];
                if ((char >= '0' && char <= '9') || char === '-') {
                    errors.push(`Row ${rowIndex + 1}: Name contains numeric characters or a minus sign.`);
                    break;
                }
            }
        }
        // Validate Age
        const ageNumber = parseInt(age, 10);
        if (isNaN(ageNumber) || ageNumber < 18 || ageNumber > 75) {
            errors.push(`Row ${rowIndex + 1}: Age isn't valid, it is not between 18 and 75.`);
        }
        // Validate Profession
        if (typeof profession !== 'string' || profession.length > 50) {
            errors.push(`Row ${rowIndex + 1}: Profession is not a string or exceeds 50 characters.`);
        }
        else {
            for (let i = 0; i < profession.length; i++) {
                const char = profession[i];
                if ((char >= '0' && char <= '9') || char === '-') {
                    errors.push(`Row ${rowIndex + 1}: Profession contains numeric characters or a minus sign.`);
                    break;
                }
            }
        }
        // Validate Gender
        const genderLower = gender.toLowerCase();
        if (genderLower !== "male" && genderLower !== "female") {
            errors.push(`Row ${rowIndex + 1}: Gender is not 'male' or 'female'.`);
        }
    });
    return errors.length > 0 ? { isValid: false, errors } : { isValid: true };
}
function parseCSV(filePath, options) {
    const csvData = node_fs_1.default
        .readFileSync(filePath, "utf-8")
        .toString()
        .replace(/\r\n/g, "\n");
    let currentState = "startDelimiter";
    const data = [];
    let currentDataArray = [];
    let currentWord = "";
    let currentPosition = 0;
    let isHeader = options.hasHeaders;
    for (const character of csvData) {
        const lookAhead = currentPosition < csvData.length
            ? csvData[currentPosition + 1]
            : undefined;
        switch (currentState) {
            case "startDelimiter":
                if (character === options.delimiter) {
                    currentState = "insideDelimiter";
                }
                else {
                    return {
                        isValid: false,
                        error: `Expected delimiter at position ${currentPosition}, found '${character}' instead.`,
                    };
                }
                break;
            case "insideDelimiter":
                if (character === options.delimiter) {
                    currentState = "endDelimiter";
                }
                else {
                    currentWord += character;
                }
                break;
            case "endDelimiter":
                if (character === options.separator) {
                    currentDataArray.push(currentWord);
                    currentWord = "";
                    currentState = "startDelimiter";
                }
                else if (character === options.terminator) {
                    currentDataArray.push(currentWord);
                    currentWord = "";
                    if (!isHeader) {
                        data.push(currentDataArray);
                    }
                    currentDataArray = [];
                    currentState = "startDelimiter";
                    isHeader = false;
                }
                else {
                    return {
                        isValid: false,
                        error: `Expected separator or terminator at position ${currentPosition}, found '${character}' instead.`,
                    };
                }
                break;
            default:
                return {
                    isValid: false,
                    error: `Unexpected state at position ${currentPosition}.`,
                };
        }
        currentPosition += 1;
    }
    if (currentState === "endDelimiter") {
        if (currentWord) {
            currentDataArray.push(currentWord);
        }
        if (currentDataArray.length > 0) {
            data.push(currentDataArray);
        }
    }
    else if (currentState !== "startDelimiter") {
        return {
            isValid: false,
            error: `Unexpected end of file.`,
        };
    }
    return { isValid: true, data };
}
const filePath = node_process_1.argv[2];
const configPath = node_process_1.argv[3];
if (!filePath || !configPath) {
    console.error("File and configuration paths are required.");
    process.exit(1);
}
const configuration = getConfigurationOptions(configPath);
if (!configuration.result) {
    console.error(configuration.error);
    process.exit(1);
}
const csvData = parseCSV(filePath, configuration.options);
if (!csvData.isValid) {
    console.error(csvData.error);
    process.exit(1);
}
const validationResult = validateData(csvData.data);
if (!validationResult.isValid) {
    console.error("Validation errors:", validationResult.errors);
    process.exit(1);
}
console.info("CSV data is valid:", csvData.data);
