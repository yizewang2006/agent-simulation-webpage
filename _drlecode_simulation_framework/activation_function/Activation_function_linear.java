package activation_function;

import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

import Utility.GlobalVariable;
import agents.Agent;
import agents.Position;
import core.Main;

public class Activation_function_linear extends Activation_function
{
	
	public double slope = 0;
	public boolean increase = true;

	//random initilize
	public Activation_function_linear()
	{
		super(2,0);
		
		Random rand;
		
		if (Main.global_var.random_no_seed == true)
		{
			rand = new Random();  
		}
		else
		{
			rand = new Random(Main.global_var.random_seed);  
		} 
		
		this.slope = Main.searchSpace.linear_activation_function_slope.get(rand.nextInt(Main.searchSpace.linear_activation_function_slope.size()));

		int random_increase = rand.nextInt(2);

		this.increase = true;

		if (random_increase == 0)
		{
			increase = false;
		}

		
	}

	//Linear function
	public Activation_function_linear(double scale, boolean increase)
	{
		this.type = 2;
		this.slope = scale;
		this.increase = increase;
	}
		
	public double linearFunction_weight_numbericProperty(double checking_value, double min, double max)
	{
		//Finear function: weight = slope * checking_value
		//Slope is positive
		if (increase == true)
		{
			weight = slope * (checking_value - min);
			
			if (checking_value <= min)
			{
				weight = 0;
			}
			else if (checking_value >= max)
			{
				weight = slope * (max - min);
			}
		}
		else
		{
			weight = slope * (max - checking_value);
			
			if (checking_value <= min)
			{
				weight = slope * (max - min);
			}
			else if (checking_value >= max)
			{
				weight = 0;
			}
		}

		return weight;
	}
	
}
