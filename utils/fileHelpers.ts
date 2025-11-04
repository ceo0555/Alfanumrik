

/**
 * Converts a File object to a Base64 encoded string, stripping the data URL prefix.
 * @param file The file to convert.
 * @returns A Promise that resolves with the Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        // reader.result is "data:mime/type;base64,the-real-base64-string"
        // We only want the Base64 part.
        const base64String = (reader.result as string).split(',')[1];
        if (base64String) {
            resolve(base64String);
        } else {
            reject(new Error("Failed to read Base64 string from file."));
        }
    };
    reader.onerror = error => reject(error);
});


/**
 * Converts a Blob object to a Base64 encoded string, stripping the data URL prefix.
 * @param blob The blob to convert (e.g., from an audio recording).
 * @returns A Promise that resolves with the Base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        if (base64String) {
            resolve(base64String);
        } else {
            reject(new Error("Failed to read Base64 string from blob."));
        }
    };
    reader.onerror = error => reject(error);
});