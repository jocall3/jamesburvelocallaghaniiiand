import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductGraph {
    /**
     * Creates a new product.
     * @param data - The product data.
     * @returns The created product.
     */
    async createProduct(data: { sku: string; name: string; brandId: string; bomId?: string }) {
        return await prisma.product.create({
            data: {
                sku: data.sku,
                name: data.name,
                brand: { connect: { id: data.brandId } },
                ...(data.bomId && { bom: { connect: { id: data.bomId } } }),
            },
        });
    }

    /**
     * Retrieves a product by its SKU.
     * @param sku - The SKU of the product.
     * @returns The product, or null if not found.
     */
    async getProductBySku(sku: string) {
        return await prisma.product.findUnique({
            where: { sku },
            include: {
                brand: true,
                bom: { include: { items: { include: { product: true } } } },
            },
        });
    }

    /**
     * Updates a product.
     * @param sku - The SKU of the product to update.
     * @param data - The updated product data.
     * @returns The updated product.
     */
    async updateProduct(sku: string, data: { name?: string; brandId?: string; bomId?: string }) {
        return await prisma.product.update({
            where: { sku },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.brandId && { brand: { connect: { id: data.brandId } } }),
                ...(data.bomId && { bom: { connect: { id: data.bomId } } }),
            },
            include: {
                brand: true,
                bom: { include: { items: { include: { product: true } } } },
            },
        });
    }

    /**
     * Deletes a product by its SKU.
     * @param sku - The SKU of the product to delete.
     * @returns The deleted product.
     */
    async deleteProduct(sku: string) {
        return await prisma.product.delete({ where: { sku } });
    }

    /**
     * Adds an item to a Bill of Materials (BOM).
     * @param bomId - The ID of the BOM.
     * @param productId - The ID of the product to add to the BOM.
     * @param quantity - The quantity of the product.
     * @returns The updated BOM item.
     */
    async addBomItem(bomId: string, productId: string, quantity: number) {
        return await prisma.bOMItem.create({
            data: {
                bom: { connect: { id: bomId } },
                product: { connect: { id: productId } },
                quantity,
            },
            include: {
                product: true,
            },
        });
    }

    /**
     * Updates a BOM item.
     * @param bomItemId - The ID of the BOM item to update.
     * @param quantity - The new quantity.
     * @returns The updated BOM item.
     */
    async updateBomItem(bomItemId: string, quantity: number) {
        return await prisma.bOMItem.update({
            where: { id: bomItemId },
            data: { quantity },
            include: {
                product: true,
            },
        });
    }

    /**
     * Removes a BOM item.
     * @param bomItemId - The ID of the BOM item to remove.
     * @returns The deleted BOM item.
     */
    async removeBomItem(bomItemId: string) {
        return await prisma.bOMItem.delete({ where: { id: bomItemId } });
    }

    /**
     * Retrieves all products.
     * @returns A list of all products.
     */
    async getAllProducts() {
        return await prisma.product.findMany({
            include: {
                brand: true,
                bom: { include: { items: { include: { product: true } } } },
            },
        });
    }
}