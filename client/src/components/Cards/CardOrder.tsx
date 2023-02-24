import deleteOrderApi from "apis/admin/order/delete-order";
import clsx from "clsx";
import { TOrder, TOrderItem } from "shared/types/order";

type TProps = {
  order: TOrder;
};
const iconClass =
  "text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full";

const orderLabelClass =
  "border-x-2 px-1 text-sm border-blueGray-300 text-center";
const productThClass =
  "px-6 align-middle border border-solid py-3 text-lg uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-right bg-blueGray-50 text-blueGray-500 border-blueGray-900";
const productTDClass =
  "border-t-0 px-6 align-middle border-l-0 border-r-0 whitespace-nowrap p-4 items-center";

const OrderCard = ({ order }: TProps) => {
  const handleOrderCompleteClick = () => {
      console.log(order._id)
    order._id && deleteOrderApi(order._id);
  };
  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
        <div className="block w-full overflow-x-auto">
          <div className="flex items-center gap-5 align-middle border border-solid py-2 uppercase border-l-0 border-r-0 font-semibold text-right bg-blueGray-200 text-blueGray-500 border-blueGray-100">
            <div className={orderLabelClass}>
              <div>שם הלקוח</div>
              <div>{order.customerName}</div>
            </div>
            <div className={orderLabelClass}>
              <div>מספר טלפון</div>
              <div>{order.customerPhone}</div>
            </div>
            <div className={orderLabelClass}>
              <div>כמות מוצרים</div>
              <div>{order.productsCount}</div>
            </div>
            <div className={orderLabelClass}>
              <div>סטטוס הזמנה</div>
              <div>{order.status}</div>
            </div>
            <div className={orderLabelClass}>
              <div>סכום לתשלום</div>
              <div>{order.totalPrice}</div>
            </div>
          </div>
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <th className={productThClass}>שם המוצר</th>
              <th className={productThClass}>כמות</th>
              <th className={productThClass}>הערה</th>
            </thead>
            <tbody>
              {order.prodcutsList.map((product: TOrderItem) => (
                <tr className="border-b border-blueGray-300">
                  <td className={productTDClass}>
                    <span className="ml-3 font-bold text-blueGray-600">
                      {product.name}
                    </span>
                  </td>
                  <td className={productTDClass}>
                    <span className="ml-3 font-bold text-blueGray-600">
                      {product.count}
                    </span>
                  </td>
                  <td className={productTDClass}>
                    <span className="ml-3 font-bold text-blueGray-600">
                      {product.comment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 flex items-center gap-8 align-middle border border-solid py-2 uppercase border-l-0 border-r-0 font-semibold text-right bg-gray-600 text-blueGray-500 border-blueGray-100">
            <div
              role="button"
              onClick={handleOrderCompleteClick}
              className={clsx(iconClass, "bg-green-600")}
            >
              <i className={clsx("fa fa-check")}></i>
            </div>
            {/* <div
              role="button"
              onClick={handleOrderCompleteClick}
              className={clsx(iconClass, "bg-red-600")}
            >
              <i className={clsx("fa fa-trash")}></i>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderCard;
