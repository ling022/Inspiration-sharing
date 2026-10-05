<template>
    <div class="orders">
        <div class="header">
            <p class="title">当前订单数量{{ orders.length }}</p>
        </div>
        <el-table 
        :data="orders"
        stripe
        style="width:100%">
            <el-table-column prop="order_no" label="ID" width="200" align="center"></el-table-column>
            <el-table-column label="购买者"  min-width="150">
                <template #default="{row}">
                    <div class="user-cell">
                        <el-avatar :src="row.buyer_avatar">
                            {{ (row.buyer_username||'?').charAt(0).toUpperCase() }}
                        </el-avatar>
                        <div class="user-info">
                            <p class="username">{{ row.buyer_username }}</p>
                            <p class="nickname">{{ row.buyer_nickname }}</p>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="售卖者" min-width="150">
                <template #default="{row}">
                    <div class="user-cell">
                        <el-avatar :src="row.seller_avatar">
                            {{ (row.seller_username||'?').charAt(0).toUpperCase() }}
                        </el-avatar>
                        <div class="user-info">
                            <p class="username">{{ row.seller_username }}</p>
                            <p class="nickname">{{ row.seller_nickname }}</p>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="售卖的灵感" min-width="150">
                <template #default="{row}">
                    <el-avatar :src="row.inspiration_cover"></el-avatar>
                    <p class="insptitle">{{ row.inspiration_title }}</p>
                </template>
            </el-table-column>
            <el-table-column prop="amount" label="售卖金额" width="80"></el-table-column>
            <el-table-column label="状态" width="80">
                <template #default="{row}">
                    <el-tag :type="statusType(row.status)">
                        {{ statusText(row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="支付时间" width="150">
                <template #default="{row}">
                    <p class="time">{{formatTime(row.paid_at)}}</p>
                </template>
            </el-table-column>
            <el-table-column label="创建时间" width="150">
                <template #default="{row}">
                    <p class="time">{{formatTime(row.created_at)}}</p>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script setup>
import {ref,onMounted} from 'vue'
import request from '@/api/request';
import { ElMessage,ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';

const orders=ref([])
const statusMap={
    0:{text:'待付款',type:'danger'},
    1:{text:'已付款',type:'success'},
    2:{text:'已完成',type:'success'},
    3:{text:'已取消',type:'info'},
    4:{text:'已退款',type:'warning'},
}
const statusType=(s)=>statusMap[s]?.type||'未知'
const statusText=(s)=>statusMap[s]?.text||'未知'
const formatTime=(s)=>s?dayjs(s).format("YYYY-MM-DD"):''
const loadOrder=async()=>{
    try{
        const res=await request.get('/admin/orders')
        if(res.code==='1000'){
            orders.value=res.data
        }else{
            ElMessage.error(res.msg)
        }
    }catch(err){
        ElMessage.error(err)
    }
}
onMounted(()=>{
    loadOrder()
})
</script>