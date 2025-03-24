# RevenueCat

We use RevenueCat to manage our in-app purchases and subscriptions. RevenueCat is a third-party service that provides a simple API to manage in-app purchases and subscriptions. It also provides a dashboard to manage the products and subscriptions.

## React Native SDK

We use `react-native-purchases` to interact with RevenueCat. The SDK is already integrated into the app.

### Product ID

They follow the naming pattern:
```
<app>_<price>_<duration>_<intro duration><intro price>
```

ex ($1.99/month, first week free):
```
gmu_199_m_1w0
```

