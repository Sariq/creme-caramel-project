import getOrdersListApi from "apis/admin/order/get-orders-list";
import { useEffect, useState } from "react";

import OrderCard from "components/Cards/CardOrder";

const OrderdsPage = () => {
  const [ordersList, setOrderList] = useState([]);

  const handleGetOrdersList = () => {
    getOrdersListApi(1).then((res) => {
        setOrderList(res.data);
      });

  };

  useEffect(() => {
    handleGetOrdersList();

   
  },[]);
  return (
    <div>
      {ordersList.reverse()?.map((order) => (
        <OrderCard order={order} />
      ))}
    </div>
  );
};

export default OrderdsPage;
