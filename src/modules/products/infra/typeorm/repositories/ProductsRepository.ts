import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const ids = products
      .map(product => product.id)
      .filter((id, i, vec) => vec.indexOf(id) === i);

    if (ids.length !== products.length) {
      throw new AppError('Has products repeated at the list');
    }

    const findedProducts = await this.ormRepository.find({
      where: { id: In(ids) },
    });

    if (findedProducts.length !== ids.length) {
      throw new AppError('Not All Products was booked');
    }

    return findedProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const ids = products.map(product => product.id);
    const findedProducts = await this.ormRepository.find({
      where: { id: In(ids) },
    });

    const updatedProducts = findedProducts.map(product => {
      const updatedProduct = { ...product };

      const order_product = products.find(item => item.id === product.id);

      updatedProduct.quantity =
        product.quantity - (order_product?.quantity || 0);

      return updatedProduct;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
