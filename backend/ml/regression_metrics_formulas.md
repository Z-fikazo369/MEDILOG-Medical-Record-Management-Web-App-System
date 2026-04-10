# Regression Scoring Metrics for Visit Forecasting

This document summarizes the scoring metrics used to evaluate the monthly visit forecasting regression model.

## 1) Mean Absolute Error (MAE)

Formula:

$$
\text{MAE} = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i|
$$

Where:

- $y_i$ is the actual value
- $\hat{y}_i$ is the predicted value
- $n$ is the number of observations

Discussion:

- MAE measures average absolute error in the same unit as the target (visit counts).
- It is easy to interpret: "On average, the prediction misses by X visits."
- Less sensitive to large outliers than squared-error metrics.

## 2) Root Mean Squared Error (RMSE)

Formula:

$$
\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2}
$$

Discussion:

- RMSE penalizes large errors more strongly because of squaring.
- Useful when large misses are more costly for operations.
- Also expressed in target units (visit counts), so still interpretable.

## 3) Mean Absolute Percentage Error (MAPE)

Formula:

$$
\text{MAPE} = \frac{100}{n} \sum_{i=1}^{n} \left|\frac{y_i - \hat{y}_i}{y_i}\right|, \quad y_i \neq 0
$$

Discussion:

- MAPE reports error as percentage, making model performance easy to communicate.
- Best for non-zero targets; zero actual values require handling or exclusion.
- In this project, MAPE is computed only for entries where $y_i \neq 0$.

## 4) Coefficient of Determination ($R^2$)

Formula:

$$
R^2 = 1 - \frac{\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}{\sum_{i=1}^{n}(y_i - \bar{y})^2}
$$

Where $\bar{y}$ is the mean of actual values.

Discussion:

- $R^2$ indicates how much variance in actual visits is explained by the model.
- $R^2 = 1$ means perfect fit; $R^2 = 0$ means no improvement over predicting the mean.
- Can be negative when model performs worse than the mean baseline.

## Why these metrics are used together

- MAE: direct operational error in visits.
- RMSE: sensitivity to large misses.
- MAPE: percentage-based communication for reports.
- $R^2$: overall explanatory power.

Using all four gives a balanced view of regression quality for monthly visit forecasting.
