import React, { useEffect, useState } from "react";

import getNewCustomersApi from "../../apis/admin/customers/get-new-customers"

// components

import CardStats from "components/Cards/CardStats.js";
import CategoryCard from "components/Cards/CardCategory";

export default function HeaderStats() {

  const [newCustomersData, setNewCustomersData] = useState(null);

  const getNewCustomers = async () => {
    const newCustomers = await getNewCustomersApi(1);
    console.log("sss", newCustomers)
    setNewCustomersData(newCustomers)
  }
  useEffect(()=>{
    getNewCustomers();
  },[])
  return (
    <>
      {/* Header */}
      <div className="relative  md:pt-10 pb-32 pt-12">
        <div className="px-4 md:px-10 mx-auto w-full">
          <div>
            {/* Card stats */}
            <div className="flex flex-wrap">
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
              <CardStats
                  statSubtitle="משתמשים חדשים"
                  statTitle={newCustomersData?.totalItems}
                  statArrow={newCustomersData?.percentDeff > 0 ? "up" : "down"}
                  statPercent={Math.abs(newCustomersData?.percentDeff)}
                  statPercentColor={newCustomersData?.percentDeff > 0 ? "text-emerald-500" : "text-red-500"}
                  statDescripiron=" יחסית לשבוע שעבר"
                  statIconName="fas fa-chart-pie"
                  statIconColor="bg-orange-500"
                />              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="NEW USERS"
                  statTitle="2,356"
                  statArrow="down"
                  statPercent="3.48"
                  statPercentColor="text-red-500"
                  statDescripiron="Since last week"
                  statIconName="fas fa-chart-pie"
                  statIconColor="bg-orange-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="SALES"
                  statTitle="924"
                  statArrow="down"
                  statPercent="1.10"
                  statPercentColor="text-orange-500"
                  statDescripiron="Since yesterday"
                  statIconName="fas fa-users"
                  statIconColor="bg-pink-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="PERFORMANCE"
                  statTitle="49,65%"
                  statArrow="up"
                  statPercent="12"
                  statPercentColor="text-emerald-500"
                  statDescripiron="Since last month"
                  statIconName="fas fa-percent"
                  statIconColor="bg-lightBlue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
