import getOrdersListApi from "apis/admin/order/get-orders-list";
import { useEffect, useState } from "react";

import OrderCard from "components/Cards/CardOrder";

const OrderdsPage = () => {
  const [ordersList, setOrderList] = useState([]);
  useEffect(() => {
    getOrdersListApi(1).then((res) => {
      console.log(res.data);
      setOrderList(res.data);
    });
  },[]);
  return (
    <div>
      {ordersList?.map((order) => (
        <OrderCard order={order} />
      ))}
    </div>
  );
};

export default OrderdsPage;
