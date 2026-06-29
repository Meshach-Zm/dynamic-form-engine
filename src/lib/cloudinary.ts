import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: File, folder: string = 'form-engine') {
    try {
        // Convert File to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64File = buffer.toString('base64');
        const dataURI = `data:${file.type};base64,${base64File}`;

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                dataURI,
                {
                    folder,
                    resource_type: 'auto',
                    type: 'upload',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
        });

        const publicId = (result as any).public_id;       // e.g. form-engine/yohcaxnywgtlpzeh3vjs.pdf
        const resourceType = (result as any).resource_type; // 'image', 'video', 'raw'
        const secureUrl = (result as any).secure_url;      // exact correct URL from Cloudinary

        // Use secure_url directly — no manual URL building needed
        const viewUrl = secureUrl;
        const downloadUrl = secureUrl.replace('/upload/', '/upload/fl_attachment/');

        return {
            viewUrl,
            downloadUrl,
            publicId,
            resourceType,
            fileName: file.name,
            size: file.size,
            type: file.type,
            url: viewUrl,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload file to Cloudinary');
    }
}

export async function uploadMultipleToCloudinary(
    files: File[],
    folder: string = 'form-engine'
): Promise<any[]> {
    const uploads = files.map((file) => uploadToCloudinary(file, folder));
    return Promise.all(uploads);
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete file from Cloudinary');
    }
}