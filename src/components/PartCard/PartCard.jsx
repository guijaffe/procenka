import { useState } from 'react';
import Badge from '../ui/Badge';
import Icon from '../Icon/Icon';

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });

export default function PartCard({ product }) {
  const [isOpen, setIsOpen] = useState(false);
  const available = product.warehouses.filter((offer) => offer.stock > 0);
  const prices = available.map((offer) => offer.price).filter((price) => price !== null);
  const unavailable = product.warehouses.length
    ? product.warehouses.every((offer) => offer.stock === 0)
    : product.stock === 0;
  const label = available.length
    ? 'В наличии на складе'
    : unavailable
      ? 'Нет в наличии'
      : 'Наличие не подтверждено';
  return (
    <details className='part-card' onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className='part-card__summary'>
        <span className='part-card__identity'>
          <span className='part-card__brand'>{product.brand}</span>
          <span className='part-card__number'>{product.number}</span>
          <span className='part-card__name'>{product.name}</span>
        </span>
        <span className='part-card__meta'>
          <Badge tone={available.length ? 'success' : 'neutral'}>{label}</Badge>
          {available.length > 0 && (
            <strong>{prices.length ? `от ${money.format(Math.min(...prices))}` : 'Цена не указана'}</strong>
          )}
          {product.totalStock > 0 && (
            <span className='part-card__stock'>Остаток: {product.totalStock} шт.</span>
          )}
          <span className='part-card__warehouse-count'>
            {product.warehouses.length
              ? `Предложения складов: ${product.warehouses.length}`
              : 'Нет складских предложений'}
          </span>
        </span>
        <Icon name='chevron-down' className='part-card__toggle' />
      </summary>
      {isOpen &&
        (product.warehouses.length ? (
          <div className='stock-table'>
            <table className='table align-middle mb-0 stock-table__table'>
              <caption className='visually-hidden'>
                Цена и остаток на складах: {product.brand} {product.number}
              </caption>
              <thead>
                <tr>
                  <th className='stock-table__heading' scope='col'>
                    Склад
                  </th>
                  <th className='stock-table__heading' scope='col'>
                    Остаток
                  </th>
                  <th scope='col' className='text-end stock-table__heading'>
                    Цена
                  </th>
                </tr>
              </thead>
              <tbody>
                {product.warehouses.map((offer) => (
                  <tr key={offer.id}>
                    <th className='stock-table__cell' scope='row'>
                      {offer.warehouse}
                    </th>
                    <td className='stock-table__cell'>
                      {offer.stock === null
                        ? 'Не указан'
                        : offer.stock > 0
                          ? `${offer.stock} шт.`
                          : 'Нет в наличии'}
                    </td>
                    <td className='text-end stock-table__cell stock-table__price'>
                      {offer.price === null ? 'Не указана' : money.format(offer.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className='part-card__empty'>
            Сервис не вернул складских предложений для этой детали.
            {product.stock === 0 ? ' Остаток: 0 шт.' : ''}
          </p>
        ))}
    </details>
  );
}
