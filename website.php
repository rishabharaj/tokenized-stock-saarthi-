# stocks/models.py
from django.db import models

class Stock(models.Model):
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10)
    current_price = models.FloatField()
    change_percent = models.FloatField()

    def __str__(self):
        return self.symbol
