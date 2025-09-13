package activation_function;

import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

import Utility.GlobalVariable;
import agents.Agent;
import agents.Position;
import core.Main;

public class Activation_function_binary extends Activation_function
{
	
	public boolean inside = true;

	//random initilize
	public Activation_function_binary()
	{
		super(1,0);
		
		Random rand;
		
		if (Main.global_var.random_no_seed == true)
		{
			rand = new Random();  
		}
		else
		{
			rand = new Random(Main.global_var.random_seed);  
		}
		
		
		int random_inside = rand.nextInt(2);

		this.inside = true;

		if (random_inside == 0)
		{
			inside = false;
		}
		
		
		this.weight = Main.searchSpace.activation_weight.get(rand.nextInt( Main.searchSpace.activation_weight.size()));

	}
		
	
	public Activation_function_binary(double w, boolean inside)
	{
		super(1,w);
		this.type = 1;
		this.inside = inside;
		this.weight = w;
	}
	
	public double binaryFunction_weight_numbericProperty(double checking_value, double min, double max)
	{
		//Return 1 if inside range of min max
		if (inside == true)
		{
			if (checking_value >= min && checking_value <= max)
			{
				return this.weight;
			}
			else
			{
				return 0;
			}
		}
		//Return 0 if inside range of min max
		else
		{
			if (!(checking_value >= min && checking_value <= max))
			{
				return this.weight;
			}
			else
			{
				return 0;
			}
		}
	
	}
	
	public double binaryFunction_weight_categoryProperty(double checking_value, ArrayList<Double> check_set)
	{
		//Return 1 if inside range of min max
		if (inside == true)
		{
			if (check_set.size() == 0)
			{
				System.out.println("Null check set for binaryFunction_weight_categoryProperty - Activation_fucntion_binary");
			}
			
			if (check_set.contains(checking_value))
			{
				return this.weight;
			}
			else
			{
				return 0;
			}
		}
		//Return 0 if inside range of min max
		else
		{
			if (check_set.contains(checking_value) == false)
			{
				return this.weight;
			}
			else
			{
				return 0;
			}
		}

		//return weight;
	}
}
